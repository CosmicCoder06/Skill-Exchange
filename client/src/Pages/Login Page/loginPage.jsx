import LoginComponent from "../../Components/Login Component/loginComponent";

function LoginPage({ onLogin, onCreateAccount, onNeedsVerification }) {
    return (
        <LoginComponent
            onLogin={onLogin}
            onCreateAccount={onCreateAccount}
            onNeedsVerification={onNeedsVerification}
        />
    );
}

export default LoginPage;
