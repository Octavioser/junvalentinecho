"use Sever";
import { loginAction } from "./login";
import style from './login.module.css';

const LoginFom = () => {

    return <div className={style.loginCotainer}>
        <form action={loginAction} className="w-full max-w-sm space-y-3">
            <input
                name="code"
                autoFocus
                pattern="\d*"
                className="w-full border rounded px-3 py-2"
            />
            <button className="w-full border rounded px-3 py-2">로그인</button>

        </form>
    </div>;
};
export default LoginFom;