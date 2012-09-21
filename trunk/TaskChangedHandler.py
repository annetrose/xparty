# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created October 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class TaskChangedHandler(XPartyRequestHandler):
    def post(self):
        self.load_xparty_context(user_type="student")
        if self.is_student:
            student = self.person
            teacher = student.lesson.teacher
            task_idx = int(self.request.get("task_idx"))                
            from updates import send_update_task
            send_update_task(student=student, teacher=teacher, task_idx=task_idx)
