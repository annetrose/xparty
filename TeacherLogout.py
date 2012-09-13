# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class TeacherLogout(XPartyRequestHandler):
    def get(self):
        from helpers import log

        self.load_xparty_context(user_type="teacher")
        logout_url = "/"
        
        if self.is_teacher:
            log("=> LOGOUT: teacher, sid=%s"%(self.session.sid))

            self.client_ids = []
            self.person.put()
        
            if self.session.is_active():
                self.session.terminate()
                
            from google.appengine.api import users
            logout_url = users.create_logout_url('/')

        self.clear_session_and_redirect(dst=logout_url)
