# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server import exceptions
from server import settings
from server import model_access

class TeacherDashboardPage(XPartyView):    
    def get(self):
        try:
            self.init_user_context("teacher")

            if exceptions.NotAnAuthenticatedTeacherError.check(self.user):
                raise exceptions.NotAnAuthenticatedTeacherError()
            
            else:
                template_values = {
                    "lessons"      : model_access.get_lessons(self.user, as_json=True),
                    "debug"        : "true" if settings.DEBUG else "false"
                }         
                self.write_response_with_template("teacher_dashboard.html", template_values)

        except exceptions.NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login()