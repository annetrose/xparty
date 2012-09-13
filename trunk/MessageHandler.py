# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class MessageHandler(XPartyRequestHandler):
    def post(self):
        self.load_xparty_context(user_type="unknown")
        if self.is_student:
            from updates import send_message_to_teacher
            student = self.person
            teacher = student.lesson.teacher
            msg = self.request.get("msg")                
            send_message_to_teacher(student=student, teacher=teacher, msg=msg)      
            response_data = { "status": 1 }
        else:
            response_data = { "status": -1, "msg": "Message from teachers not handled yet"}
         
        import json
        self.response.headers.add_header('Content-Type', 'application/json', charset='utf-8')
        self.response.out.write(json.dumps(response_data))
