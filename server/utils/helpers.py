# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn - www.cs.umd.edu/~aq
#          Anne Rose - www.cs.umd.edu/hcil/members/~arose
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0

def log(msg):
    import logging, server.settings
    if server.settings.ENABLE_DEBUG_LOGGING:
        logging.getLogger().info(msg)

def to_json(data):        
    import json
    return json.dumps(data, default=_json_handler)

def from_json(data):
    import json
    return json.loads(data)
  
def _json_handler(o):
    from datetime import datetime
    if isinstance(o, datetime):
#        return "(new Date(%d, %d, %d, %d, %d, %d))"%(
#            o.year,
#            o.month-1,  
#            o.day,
#            o.hour,
#            o.minute,
#            o.second)
        return o.strftime("%B %d, %Y %H:%M:%S")
    else:
        raise TypeError(repr(o))