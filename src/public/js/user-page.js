(function($) {
    
    // Change Password
    let pass_form = $('#change-pass-form');
    pass_form.submit(function(event) {
        event.preventDefault();

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
        $.ajax(requestConfig).then(function(responseMessage) {
            window.location.href = "/";
        });

    });

})(window.jQuery);
