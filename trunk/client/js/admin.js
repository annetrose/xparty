/*
# XParty - A Framework for Building Tools to Support Social Learning in Synchronous Environments
# Authors: Ben Bederson - www.cs.umd.edu/~bederson
#          Alex Quinn -- www.alexquinn.org
#          University of Maryland, Human-Computer Interaction Lab - www.cs.umd.edu/hcil
# Date: Originally created July 2011
# License: Apache License 2.0 - http://www.apache.org/licenses/LICENSE-2.0
*/

function updateValues() {
	$('#msg_dialog').html("<p>Are you sure you want to update values in datastore?</p>")
	$('#msg_dialog').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/admin", {
            	type: 'POST',
    			async: false,
    			data: {
    				action: "updatevalues"
    			},
    			success: function(data,textStatus,jqXHR) {
    				if (data.status==1) {
    					if (typeof updateUI == 'function') {
    					   updateUI();
    					}
    				}
    				else {
    					alert(data);
    				}
    			},
    			error: function(jqXHR, textStatus, errorThrown) {
    				alert(textStatus);
    			}
    	    });
          },
		  No: function() {
            $(this).dialog("close");
          }
        }
    });
}