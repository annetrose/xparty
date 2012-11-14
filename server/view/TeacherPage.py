# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server import channel
from server import exceptions
from server import model_access
from server.utils import helpers

class TeacherPage(XPartyView):    
    def get(self, activity_code):
        try:
            self.init_user_context("teacher")
            activity = model_access.get_activity(activity_code)
        
            if exceptions.NotAnAuthenticatedTeacherError.check(self.user):
                raise exceptions.NotAnAuthenticatedTeacherError()

            if exceptions.ActivityNotFoundError.check(activity):
                raise exceptions.ActivityNotFoundError()
            
            if exceptions.WrongPersonError.check(activity.teacher, self.user):
                raise exceptions.WrongPersonError()

            template_values = {
                'token'              : channel.create_channel(person=self.user, activity_code=activity_code),
                'activity'           : helpers.to_json(activity.to_dict()),
                'students'           : model_access.get_students(activity=activity, as_json=True),
                'task_histories'     : model_access.get_student_actions(activity, group_by_task=True, as_json=True)
            }
            teacher_template = self.get_custom_template("teacher", activity)
            self.write_response_with_template(teacher_template, template_values, custom=True)

        except (exceptions.NotAnAuthenticatedTeacherError, exceptions.WrongPersonError):
            self.redirect_to_teacher_login()

        except exceptions.ActivityNotFoundError:
            self.redirect_with_msg(msg="Activity not found. Please choose an activity to continue.", dst="/teacher_dashboard")
