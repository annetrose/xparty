# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyRequestHandler import XPartyRequestHandler

class ChannelExpiredHandler(XPartyRequestHandler):
    def post(self, lesson_code):           
        self.load_xparty_context(user_type="unknown")
        
        if self.is_teacher:
            token = self.create_channel(person_key=self.person.user.user_id(), lesson_code=lesson_code)
        
        elif self.is_student:
            token = self.create_channel(person_key=self.person.nickname, lesson_code=lesson_code)
        
        else:
            token = None
            
        from helpers import log
        log("=> CHANNEL EXPIRED. CREATED NEW CHANNEL: {0}".format(str(token)))
        
        import json
        data = { 'token': token, 'status': 1 }
        self.response.out.write(json.dumps(data))
        
