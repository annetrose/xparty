# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#           Alex Quinn - www.cs.umd.edu/~aq
#           Anne Rose - www.cs.umd.edu/hcil/members/~arose
#           University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyView import XPartyView
from server.lib import gaesessions

class StudentLoginPage(XPartyView):
    def get(self):
        self.init_user_context("student")
        self.write_response_with_template("student_login.html")
        
        session = gaesessions.get_current_session()
        session.terminate()
        session.clear()
        session.regenerate_id()