# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created April 2012
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from XPartyHandler import XPartyHandler
from server import channel

class ChannelExpiredHandler(XPartyHandler):
    def post(self, activity_code):
        self.init_user_context()
        token = channel.create_channel(self.user, activity_code)
        self.write_response_as_json({ "status":1, "token": token })
        
