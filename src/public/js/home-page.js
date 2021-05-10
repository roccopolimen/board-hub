(function($) {

    const displayErrorPage = err => {
        $('body').html($(err.responseText.match(/\<body[^>]*\>([^]*)\<\/body/m)[1]));
    };

    let signup = $('#signup');
    signup.on("click", (e) => {
        e.preventDefault();
        let logContainer = $('#login-container');
        let signContainer = $('#signup-container');
        logContainer.hide();
        signContainer.show();
    });

    let login = $('#login');
    login.on("click", (e) => {
        e.preventDefault();
        let logContainer = $('#login-container');
        let signContainer = $('#signup-container');
        signContainer.hide();
        logContainer.show();
    });

    let closeLogin = $('#close-login');
    closeLogin.on("click", (e) => {
        e.preventDefault();
        let logContainer = $('#login-container');
        logContainer.hide();
    });

    let loginSignup = $('#login-signup');
    loginSignup.on("click", (e) => {
        e.preventDefault();
        let logContainer = $('#login-container');
        let signContainer = $('#signup-container');
        logContainer.hide();
        signContainer.show();
    });

    let closeSignup = $('#close-signup');
    closeSignup.on("click", (e) => {
        e.preventDefault();
        let signContainer = $('#signup-container');
        signContainer.hide();
    });
    
    let login_form = $('#login-form');
    login_form.submit(function(event) {
        event.preventDefault();

        $('#login-error').hide();


        let email = $('#email').val();
        let password = $('#password').val();
        if(email && (email = email.trim()) !== '' &&
         password && password !== '') { // input exists

            let requestConfig = {
                method: 'POST',
                url: '/users/login',
                contentType: 'application/json',
                data: JSON.stringify({email, password})
                };
            $.ajax(requestConfig).then(responseMessage => {
                let error = $(responseMessage)[0];
                if(error.error)
                    $('#login-error').show();
                else {
                    window.location.href = "/boards";
                }
            },
            err => {
                displayErrorPage(err);
            });
         } else { // inputs don't exist
            $('#login-error').show();
         }
    });

    let signup_form = $('#signup-form');
    signup_form.submit(function(event) {
        event.preventDefault();

        $('#signup-error').hide();

        let firstName = $('#firstName').val();
        let lastName = $('#lastName').val();
        let email = $('#signEmail').val();
        let re_email = $('#verEmail').val();
        let password = $('#signPassword').val();
        let re_password = $('#verPassword').val();
        if(firstName && (firstName = firstName.trim()) !== '' &&
            lastName && (lastName = lastName.trim()) !== '' &&
            email && (email = email.trim()) !== '' && email === re_email.trim() &&
            password && password !== '' && password === re_password) { // input exists

            let requestConfig = {
                method: 'POST',
                url: '/users/signup',
                contentType: 'application/json',
                data: JSON.stringify({firstName, lastName, email, password})
                };
            $.ajax(requestConfig).then(responseMessage => {
                let error = $(responseMessage)[0];
                if(error.error)
                    $('#signup-error').show();
                else {
                    window.location.href = "/boards";
                }
            },
            err => {
                displayErrorPage(err);
            });
         } else { // inputs don't exist
            $('#signup-error').show();
         }
    });
})(window.jQuery);
