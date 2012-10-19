# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server import exceptions
from server import model_access

class AdminPage(XPartyView):    
    def get(self):
        try:
            self.init_user_context("teacher")

            if exceptions.NotAnAuthenticatedAdminError.check(self.user):
                raise exceptions.NotAnAuthenticatedAdminError()
            
            else:
                self.write_response_with_template("admin.html")

        except exceptions.NotAnAuthenticatedAdminError:
            if self.user is None:
                self.init_user_context()
            model_access.log_out_person(self.user)
            self.redirect_with_msg(msg="Please log in as an administrator.")