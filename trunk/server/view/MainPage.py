# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server import model_access

class MainPage(XPartyView):
    def get(self):
        self.init_user_context()
        if  model_access.is_teacher_logged_in(self.user):
            self.redirect("/teacher_dashboard")

        elif model_access.is_student_logged_in(self.user):
            self.redirect("/student")

        else:
            self.write_response_with_template("index.html")
