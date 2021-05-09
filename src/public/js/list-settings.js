(function($) {
    const displayErrorPage = err => {
        $('body').html($(err.responseText.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]));
    };

    //The modal
    var modal = document.getElementById("listSettingsModal");
    //Button that opens the modal
    var btn = document.getElementById("myBtn");
    //X that closes the modal
    var span = document.getElementsByClassName("close")[0];

    let listSettings = $('#listSettingsModal');
    let listName = $('#listName').val();
    let positionVal = $('#positionVal').val();

    btn.onclick = function() {
        modal.style.display = "block";
    }
    span.onclick = function() {
        modal.style.display = "none";
    }
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    listSettings.submit(event => {
        event.preventDefault();

        let formData = listSettings.serializeArray();
        let updateListName = formData[formData.findIndex(x => x.name === 'listName')].value;
        let updatePositionVal = formData[formData.findIndex(x => x.name === 'position')].value;

        if(updateListName.trim().length === 0) {
            alert('List must have a name.');
            return;
        }
        updateListName = updateListName.trim();
        if((typeof(updatePositionVal) !== 'number' || updatePositionVal < 0)){
            alert('Position must be a positive integer.');
            return;
        }
        if(updateListName === listName && updatePositionVal === positionVal) {
            alert('Nothing was changed');
            return;
        }

        $.ajax(
            {
                method: 'PATCH',
                url: listSettings.attr('action'),
                data: { listName: updateListName, position: updatePositionVal }
            }
        ).then(res => {
            let boardId = $(res)[0].boardId;
            window.location.href = `/board/${boardId}`;
        }, err => displayErrorPage(err));
    });

})(window.jQuery);
