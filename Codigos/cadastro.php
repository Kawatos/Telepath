<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Telepath Cadastro</title>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
</head>
<body>
    <main>
        <section>
            <div id="imagem">

            </div>
            <div id="formulario">
                <h1>Aqui você coloca os dados</h1>
                <p>
                <form action="cadastro.php" method="post">
                <div class="campo">
                        <span class="material-symbols-outlined">person</span>
                        <input type="text" name="primeironome" id="iprimeirologin" placeholder="Seu nome" autocomplete="name" required maxlength="30">
                        <label for="inovologin">Insira aqui o nome</label>
                    </div>
                    <div class="campo">
                        <span class="material-symbols-outlined">mail</span>
                        <input type="email" name="primeirologin" id="iprimeirologin" placeholder="Seu e-mail" autocomplete="email" required maxlength="30">
                        <label for="inovologin">Insira aqui o seu email</label>
                    </div>
                    <div class="campo">
                        <span class="material-symbols-outlined">key</span>
                        <input type="password" name="primeirasenha" id="iprimeirasenha" placeholder="Sua senha" autocomplete="current-password" required minlength="8" maxlength="30">
                        <label for="iprimeirasenha">Crie uma senha</label>
                    </div>
                    <input type="submit" value="Entrar">
                </form>

                    <form method="get" action="index.html">
                        <input type="submit" value="Voltar">
                    </form>
                </p>
                
                
            </div>
        </section>
    </main>
    
</body>
</html>