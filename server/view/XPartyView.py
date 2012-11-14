# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import model_access
from server import user
from server.lib import gaesessions
from server.view import templates, custom_templates
from google.appengine.ext.webapp import template
import os, webapp2
        
class XPartyView(webapp2.RequestHandler):
    user = None

    def init_user_context(self, user_type=None):
        # Get the current browser session, if any
        # Otherwise, create one
        session = gaesessions.get_current_session()          
        if session.sid is None:
            session.start()
        
        # Check if user logged in and set self.user   
        self.user = user.get_user(user_type)
     
    def get_custom_template(self, person_type, activity):
        template = "".join((person_type, ".html"))
        if activity.activity_type is not None:
            custom_template = "".join((person_type, "_", activity.activity_type, ".html"))
            if os.path.isfile(os.path.join(os.path.dirname(custom_templates.__file__), custom_template)):
                template = custom_template
        return template;
                               
    def write_response_with_template(self, template_filename, more_template_vals=None, custom=False):
        template_vals = self._init_template_values()
        if more_template_vals is not None:
            template_vals = dict(template_vals.items() + more_template_vals.items())
        template_dir = os.path.dirname(custom_templates.__file__) if custom else os.path.dirname(templates.__file__)
        template_filename = os.path.join(template_dir, template_filename)
        html = template.render(template_filename, template_vals)    
        self.response.out.write(html)
        
    def redirect_to_student_login(self, msg=None):
        self.redirect_with_msg(msg=msg, dst="/student_login")
        
    def redirect_to_teacher_login(self):
        self.redirect(user.get_teacher_login_url())

    def redirect_with_msg(self, msg=None, dst='/'):
        if msg is not None:
            session = gaesessions.get_current_session()
            session['msg'] = msg
        self.redirect(dst)
    
    def _init_template_values(self):
        session = gaesessions.get_current_session()
        template_values = {}
        template_values["user_type"] = model_access.get_person_type(self.user)
        template_values["is_logged_in"] = model_access.is_student_logged_in(self.user) or model_access.is_teacher_logged_in(self.user)
        template_values["nickname"] = model_access.get_person_nickname(self.user)
        template_values["teacher_login_url"] = user.get_teacher_login_url() if self.user is None else None
        template_values["msg"] = session.pop("msg") if session.has_key("msg") else ""
        return template_values
