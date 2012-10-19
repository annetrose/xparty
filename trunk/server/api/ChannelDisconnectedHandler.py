# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
                       
from server import model_access
import webapp2
            
class ChannelDisconnectedHandler(webapp2.RequestHandler):
    def post(self): 
        client_id = self.request.get('from', None)   
        model_access.remove_client_id_from_person(client_id)
