# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class StudentPage(XPartyRequestHandler):
    def get(self):
        
        self.load_xparty_context(user_type="student")
        
        if self.person is None or not self.is_student or not self.person.is_logged_in:
            self.redirect_with_msg('Please log in again.')
            
        else:
            student = self.person
            token = self.create_channel(person_key=student.nickname, lesson_code=student.lesson.lesson_code)
              
            template_values = {               
                'header'        : self.gen_header("student"),
                'token'         : token,
                'student'       : student,
                'lesson'        : student.lesson,
            }
            if self.session.has_key('msg'):
                template_values['msg'] = self.session.pop('msg')  # only show the message once

            self.write_response_with_template("student.html", template_values)
