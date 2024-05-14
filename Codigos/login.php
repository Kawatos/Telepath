<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telepath Login</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
</head>
<body>
    <main>
        <section>
            <div id="imagem">

            </div>
            <div id="formulario">
                <h1>Telepath Login</h1>
                <p>
                <?php 
                if ($_SERVER["REQUEST_METHOD"] == "POST") {
                    $phpusuarioemail = "kauasilvamattos0000@gmail.com"; 
                    $phpsenha = "12345678"; 
                    
                    if ($_POST["login"] == $phpusuarioemail && $_POST["senha"] == $phpsenha) {
                        //header("Location: sucesso.php");
                        echo "Sucesso!!";
                        
                        exit();
                    } else {
                        echo "Usuário ou senha inválidos.";
                    }
                }
                ?>
                </p>
                <form action="login.php" method="post">
                    <div class="campo">
                        <span class="material-symbols-outlined">mail</span>
                        <input type="email" name="login" id="ilogin" placeholder="Seu e-mail" autocomplete="email" required maxlength="30">
                        <label for="ilogin">Login</label>
                    </div>
                    <div class="campo">
                        <span class="material-symbols-outlined">key</span>
                        <input type="password" name="senha" id="isenha" placeholder="Sua senha" autocomplete="current-password" required minlength="8" maxlength="30">
                        <label for="isenha">Senha</label>
                    </div>
                    <input type="submit" value="Entrar">
                    <a href="esqueci.php" class="botao">Esqueci a senha<span id="spn" class="material-symbols-outlined">email</span></a>
                </form>
                
                <form method="get" action="index.html">
                    <input type="submit" value="Voltar">
                </form>
                
            </div>
        </section>
    </main>
    
</body>
</html>