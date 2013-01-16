# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

from server import model_access
import webapp2
            
class ChannelConnectedHandler(webapp2.RequestHandler):
    def post(self): 
        # BUG (when running on localhost): Client_id returned by self.request.get 
        # is not complete if student nickname contains special characters such as ", ', #
        client_id = self.request.get('from', None)
        model_access.add_client_id_to_person(client_id)
        from server.utils import helpers
        helpers.log("*** CLIENT ID ADDED TO PERSON ***");