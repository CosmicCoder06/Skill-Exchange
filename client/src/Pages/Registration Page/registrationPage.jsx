import Register from "../../Components/Registration Component/registrationFormComponent";

function RegistrationPage({
    onBackHome,
    onBackToLogin,
    onRegistered
}) {
    return (
        <Register
            onBackHome={onBackHome}
            onBackToLogin={onBackToLogin}
            onRegistered={onRegistered}
        />
    );
}

export default RegistrationPage;
