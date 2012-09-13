# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

import webapp2

class XPartyChannelHandler(webapp2.RequestHandler):
    def load_user(self):
        self.client_id = self.request.get('from', None)
        import client_id_utils
        self.person_type = client_id_utils.person_type_for_client_id(self.client_id)
        assert self.person_type in ("student", "teacher")

        self.person = None
        person_key = client_id_utils.person_key_for_client_id(self.client_id)
        if self.person_type == "teacher":
            from model import Teacher
            self.person = Teacher.get_by_key_name(person_key)
        else:
            from model import Student
            lesson_code = client_id_utils.lesson_code_for_client_id(self.client_id)
            student_key = "::".join((person_key, lesson_code))
            self.person = Student.get_by_key_name(student_key)
            
        if self.person is None:
            from helpers import log
            log("***** ERROR: Person not found for client_id {0}".format(self.client_id))
