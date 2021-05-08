(function($) {

    const displayErrorPage = err => {
        $('body').html($(err.responseText.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]));
    };
    
    // Change Password
    let pass_form = $('#change-pass-form');
    pass_form.submit(function(event) {
        event.preventDefault();

        $('#change-pass-error').hide();

        let oldPass = $('#oldPass').val();
        let newPass = $('#newPass').val();
        let verNewPass = $('#verNewPass').val();
        if(oldPass && newPass && verNewPass && 
            newPass === verNewPass) { // input exists

            let requestConfig = {
                method: 'PUT',
                url: '/users/password',
                contentType: 'application/json',
                data: JSON.stringify({oldPass, newPass})
                };
            $.ajax(requestConfig).then(function(responseMessage) {
                let error = $(responseMessage)[0];
                if(error.error)
                    $('#change-pass-error').show();
                else {
                    window.location.href = "/users";
                }
            },
            err => {
                displayErrorPage(err);
            });
         } else { // inputs don't exist
            $('#change-pass-error').show();
         }
    });


    // Sign Out
    let signout = $("#sign-out");
    signout.click(function(event) {
        event.preventDefault();

        let requestConfig = {
            method: 'GET',
            url: '/users/signout',
            contentType: 'application/json',
            data: JSON.stringify({})
            };
        $.ajax(requestConfig).then(function(responseMessage) {
            window.location.href = "/";
        },
        err => {
            displayErrorPage(err);
        });

    });

    // Delete Account
    let delete_acc = $("#delete-account");
    delete_acc.click(function(event) {
        event.preventDefault();

        let requestConfig = {
            method: 'POST',
            url: '/users/delete',
            contentType: 'application/json',
            data: JSON.stringify({})
            };
        $.ajax(requestConfig).then(responseMessage => {
            window.location.href = "/";
        },
        err => {
            displayErrorPage(err);
        });

    });

})(window.jQuery);
