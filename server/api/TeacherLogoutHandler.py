# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import model_access
from server import user

class TeacherLogoutHandler(XPartyHandler):    
    def get(self):
        self.init_user_context("teacher")
        if model_access.is_teacher_logged_in(self.user):
            model_access.log_out_person(self.user)
            self.clear_session_and_redirect(dst=user.get_teacher_logout_url())
