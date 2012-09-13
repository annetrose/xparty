# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class StudentLogout(XPartyRequestHandler):
    def get(self):
        self.load_xparty_context(user_type="student")
        
        if self.is_student and self.person.is_logged_in:
            student = self.person
            student.log_out(True)
            self.clear_session_and_redirect(dst="/")
