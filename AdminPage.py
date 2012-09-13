# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class AdminPage(XPartyRequestHandler):

    def get(self):
        self.load_xparty_context(user_type="teacher")

        try:
            if not self.is_teacher:
                raise NotAnAuthenticatedTeacherError()
            
            elif not self.person.admin:
                raise NotAnAdminError()
            
            else:  
                action = self.request.get("action", "");
                if action=="updatevalues":
                    self.update_values()
                else:
                    template_values = {
                        "header" : self.gen_header("teacher")
                    }

                    if self.session.has_key('msg'):
                        template_values['msg'] = self.session.pop('msg')
                
                    self.write_response_with_template("admin.html", template_values)
            
        except NotAnAuthenticatedTeacherError:
            self.redirect_to_teacher_login(dst='admin')
        
        except NotAnAdminError:
            self.redirect("/teacher_dashboard")


    def post(self):
        self.get();
      
    # helpful when adding new attributes to existing datastore entities and default needs to be set
    def update_values(self):          
        from model import Teacher
        query = Teacher.all()
        for teacher in query:
            teacher.admin = False
            teacher.put()
            
        self.write_response_plain_text("OK")

class NotAnAuthenticatedTeacherError(Exception): pass
class NotAnAdminError(Exception): pass
