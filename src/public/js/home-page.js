(function($) {
    
    let login_form = $('#login-form');
    login_form.submit(function(event) {
        event.preventDefault();

        // TODO - Error Checking

        let email = $('#email').val();
        let password = $('#password').val();
        if(email && (email = email.trim()) !== '' &&
         password && (password = password.trim()) !== '') { // input exists

            let requestConfig = {
                method: 'POST',
                url: '/users/login',
                contentType: 'application/json',
                data: JSON.stringify({email, password})
                };
            $.ajax(requestConfig).then(function(responseMessage) {
                let error = $(responseMessage)[0];
                if(error.error)
                    $('#login-error').show();
                else {
                    window.location.href = "/boards";
                }
            });
         } else { // inputs don't exist
            $('#login-error').show();
         }
    });

    let signup_form = $('#signup-form');
    signup_form.submit(function(event) {
        event.preventDefault();

        let firstName = $('#firstName').val();
        let lastName = $('#lastName').val();
        let email = $('#signEmail').val();
        let re_email = $('#verEmail').val();
        let password = $('#signPassword').val();
        let re_password = $('#verPassword').val();
        if(firstName && (firstName = firstName.trim()) !== '' &&
            lastName && (lastName = lastName.trim()) !== '' &&
            email && (email = email.trim()) !== '' && email === re_email.trim() &&
            password && (password = password.trim()) !== '' && password === re_password.trim()) { // input exists

            let requestConfig = {
                method: 'POST',
                url: '/users/signup',
                contentType: 'application/json',
                data: JSON.stringify({firstName, lastName, email, password})
                };
            $.ajax(requestConfig).then(function(responseMessage) {
                let error = $(responseMessage)[0];
                if(error.error)
                    $('#signup-error').show();
                else {
                    window.location.href = "/boards";
                }
            });
         } else { // inputs don't exist
            $('#signup-error').show();
         }
    });
})(window.jQuery);
