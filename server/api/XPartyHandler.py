# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import user
from server.lib import gaesessions
from server.utils import helpers
import re, webapp2
        
class XPartyHandler(webapp2.RequestHandler):
    user = None

    def init_user_context(self, user_type=None):
        # Get the current browser session, if any
        # Otherwise, create one
        session = gaesessions.get_current_session()          
        if session.sid is None:
            session.start()
        
        # Check if user logged in and set self.user   
        self.user = user.get_user(user_type)
              
    def write_response_as_json(self, data):  
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(helpers.to_json(data))
    
    def write_response_as_file(self, encoded_content, content_type, filename, encoding):
        # Filename may consist of only letters, numbers, period, underscore, and hyphen.
        assert re.match(r"^[-_.a-zA-Z0-9]+$", filename) is not None, repr(filename)

        if encoding is not None:
            content_type += "; charset=%s"%encoding

        self.response.headers["Content-Type"] = content_type
        self.response.headers["Content-Disposition"] = 'attachment; filename="%s"'%filename
        self.response.out.write(encoded_content)

    def clear_session_and_redirect(self, dst):
        session = gaesessions.get_current_session()          
        session.terminate()
        session.clear()
        session.regenerate_id()
        self.redirect(dst)