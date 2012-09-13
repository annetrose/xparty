# XParty - A Framework for Building Tools for Learning in a Web-Based Classroom
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyChannelHandler import XPartyChannelHandler

class ChannelDisconnectedHandler(XPartyChannelHandler):
    def post(self):    
        from helpers import log
        self.load_user()
        if self.client_id not in self.person.client_ids:
            log("=> CLIENT ID NOT FOUND: {0}".format(self.client_id))
        else:
            self.person.remove_client_id(self.client_id)
            self.person.put()
            
        log("=> CHANNEL DISCONNECTED: {0} ({1})".format(str(self.client_id),len(self.person.client_ids)))

        # do not check if self.person.is_logged_in since this may already return false
        # in some browsers before ChannelDisconnectHandler is called
        # e.g., cause implicit logout by closing Firefox browser
        if self.person_type=="student" and len(self.person.client_ids)==0:
            self.person.log_out()
            log("=> STUDENT LOGGED OUT (PASSIVELY)")
