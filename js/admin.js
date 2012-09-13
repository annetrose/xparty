function updateValues() {
	$('#message').html("<p>Are you sure you want to update values in datastore?</p>")
	$('#message').dialog({
        autoOpen: true,
        modal: true,
        buttons: {
          Yes: function() {
            $(this).dialog("close");
            $.ajax("/admin", {
    			async: false,
    			data: {
    				action: "updatevalues"
    			},
    			success: function(data,textStatus,jqXHR) {
    				if (data.trim()=="OK") {
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

function createTeacherFilter(teacherName) {
    var teachers = getTeachers();
    if (teachers.length>0) {
        var html = '<select id="teacher_filter">';
        html += '<option value="">All Teachers</option>';
        for (var i=0; i<teachers.length; i++) {
        	var selected = '';
        	if (teacherName!=undefined && teachers[i]==teacherName) {
        		selected = 'selected="selected"';
        	}
            html += '<option value="'+teachers[i]+'" '+selected+'>'+teachers[i]+'</option>';
        }
        html += '</select>';
        $('#lesson_filter').html(html);
    }
}

function getTeachers() {	
    var teachers = [];
    for (var i=0; i<g_lessons.length; i++) {
        var lesson = g_lessons[i];
        var teacherName = lesson.teacher_name;
        if (teacherName && $.inArray(teacherName, teachers)==-1) {
            teachers.push(teacherName);
        }
    }
    
    teachers.sort();
    return teachers;
}