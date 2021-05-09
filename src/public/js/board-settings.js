(function($) {
    
    // renders the error body on the page
    const displayErrorPage = err => {
        $('body').html($(err.responseText.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]));
    };

    // CHANGE BOARD SETTINGS FORM
    let changeBoardSettings = $('#changeBoardForm');
    let originalName = $('#boardName').val();
    let originalColor = $('#boardColor').val();
    let originalDescription = $('#description').val();
    changeBoardSettings.submit(event => {
        event.preventDefault();

        // get the inputs
        let formData = changeBoardSettings.serializeArray();
        let boardName = formData[formData.findIndex(
            ele => ele.name === 'boardName')].value;
        let boardColor = formData[formData.findIndex(
            ele => ele.name === 'boardColor')].value;
        let description = formData[formData.findIndex(
            ele => ele.name === 'description')].value;
        
        // error checking the inputs
        if(boardName.trim().length === 0) {
            alert('Board must have a name.');
            return;
        }
        if(/^#[0-9A-F]{6}$/i.test(boardColor) === false) {
            alert('Color must be a Hex Code in the form #dddddd');
            return;
        }
        boardName = boardName.trim();
        description = description.trim();

        // check if anything was changed
        if(boardName === originalName && boardColor === originalColor && description === originalDescription) {
            alert('Nothing to change!');
            return;
        }

        // all inputs are good, make the request
        $.ajax({
            method: 'PATCH',
            url: changeBoardSettings.attr('action'),
            data: { boardName: boardName, boardColor: boardColor, description: description }
        }).then(res => {
            let boardId = $(res)[0].boardId;
            window.location.href = `/board/${boardId}`;
        }, err => displayErrorPage(err));
    });

    // LEAVE BOARD (no client-side required)

    // INVITE FORM
    let inviteForm = $('#inviteForm');
    inviteForm.submit(event => {
        event.preventDefault();

        // get the input
        let formData = inviteForm.serializeArray();
        let email = formData[formData.findIndex(
            ele => ele.name === 'email')].value;       
            
        // error check the input
        if(email.trim().length === 0) {
            alert('must provide a user email to invite');
            return;
        }
        const emailRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if(emailRegEx.test(email.trim().toLowerCase()) === false) {
            alert('must provide a valid email to invite');
            return;
        }
        email = email.trim().toLowerCase();

        // inputs are good, make the request
        $.ajax({
            method: 'POST',
            url: inviteForm.attr('action'),
            data: { email: email }
        }).then(res => {
            if($(res)[0].noUser) {
                alert('user does not exist, cannot add to board.');
            } else if($(res)[0].alreadyMember) {
                alert('user is already a member of this board.');
            } else {
                window.location.href = `/board/${$(res)[0].boardId}`;
            }
        }, err => displayErrorPage(err));
        $("#inviteEmail").val("");
    });

})(window.jQuery);
