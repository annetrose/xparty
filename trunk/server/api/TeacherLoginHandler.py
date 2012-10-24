# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import model_access
from server.lib import gaesessions
from google.appengine.api import users
from webapp2_extras.users import login_required

class TeacherLoginHandler(XPartyHandler):
    @login_required
    def get(self): 
        google_user = users.get_current_user()  # authenticated Google user
        self.init_user_context("teacher")
      
        # Close any active session the user has since s/he is trying to login
        session = gaesessions.get_current_session()
        if session.is_active():
            session.terminate()

        # Get the teacher's record
        if not model_access.is_teacher_logged_in(self.user):
            self.user = model_access.create_teacher(google_user)

        # Create a new session ID, for added security.
        session.regenerate_id()

        # Redirect to dashboard
        page = self.request.get("page", "teacher_dashboard")
        self.redirect('/'+page)
