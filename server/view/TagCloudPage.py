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
from server.view import custom_templates
import os

class TagCloudPage(XPartyView):    
    def get(self, activity_code, task_idx):
        try:
            self.init_user_context("student")
            activity = model_access.get_activity(activity_code)

            if exceptions.NotAnAuthenticatedStudentError.check(self.user):
                raise exceptions.NotAnAuthenticatedStudentError()

            if exceptions.ActivityNotFoundError.check(activity):
                raise exceptions.ActivityNotFoundError()

            template_values = {
                'token'              : channel.create_channel(person=self.user, activity_code=activity_code),
                'activity'           : helpers.to_json(activity.to_dict()),
                'task_idx'           : task_idx,
                'students'           : model_access.get_students(activity=activity, as_json=True),
                'task_histories'     : model_access.get_student_actions(activity, group_by_task=True, as_json=True)
            }
            
            template = "tagcloud.html"
            custom_template = "".join(("tagcloud_", activity.activity_type, ".html"))
            if os.path.isfile(os.path.join(os.path.dirname(custom_templates.__file__), custom_template)):
                template = custom_template
            self.write_response_with_template(template, template_values, custom=True)

        except (exceptions.NotAnAuthenticatedStudentError):
            self.redirect_to_student_login()

        except exceptions.ActivityNotFoundError:
            self.redirect_with_msg(msg="Activity not found")
