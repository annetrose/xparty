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

class StudentPage(XPartyView):    
    def get(self):
        try:
            self.init_user_context("student")

            if exceptions.NotAnAuthenticatedStudentError.check(self.user):
                raise exceptions.NotAnAuthenticatedStudentError()
            
            else:
                template_values = {
                    'token'              : channel.create_channel(person=self.user, activity_code=self.user.activity.activity_code),
                    'student'            : helpers.to_json(self.user.to_dict()),
                    'activity'           : helpers.to_json(self.user.activity.to_dict()),
#                   'activity_type'      : self.user.activity.activity_type,
                    'task_histories'     : model_access.get_student_actions(self.user.activity, student=self.user, group_by_task=True, as_json=True)
                    }
                
                student_template = self.get_custom_template("student", self.user.activity)
                self.write_response_with_template(student_template, template_values, custom=True)

        except exceptions.NotAnAuthenticatedStudentError:
            self.redirect_to_student_login(msg="Please log in again.")