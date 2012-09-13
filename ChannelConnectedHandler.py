# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyChannelHandler import XPartyChannelHandler

class ChannelConnectedHandler(XPartyChannelHandler):
    def post(self):
        from helpers import log
        self.load_user()
        self.person.add_client_id(self.client_id)
        if self.person_type=="student" and len(self.person.client_ids)==1:
            self.person.latest_logout_timestamp = None
        self.person.put()
        
        log("=> CHANNEL CONNECTED: {0} ({1})".format(str(self.client_id),len(self.person.client_ids)))
                
        if self.person_type=="student" and len(self.person.client_ids)==1:
            from client_id_utils import lesson_code_for_client_id
            from model import Lesson
            from updates import send_update_log_in
            lesson_code = lesson_code_for_client_id(self.client_id)
            lesson = Lesson.get_by_key_name(lesson_code)
            send_update_log_in(student=self.person, teacher=lesson.teacher)
