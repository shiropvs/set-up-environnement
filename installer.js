const { prompt } = require('enquirer');
const { execSync } = require('child_process');
const fs = require('fs');

const installScript = fs.readFileSync('installer.js', 'utf-8');


console.log("🌟 bienvenue dans le script de configuration de l'environnement d'un projet dev 🌟\n");
console.log("ce script sert à automatiser l'installation des différents langages avec leurs packages.\n");

eval(installScript);

// function pour ouvrir une URL dans le navigateur
function openURL(url) {
    exec(`open ${url}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`erreur lors de l'ouverture de l'URL : ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`erreur : ${stderr}`);
            return;
        }
        console.log(`navigateur ouvert avec succès.`);
    });
}

let folders = {};
let ports = {};

prompt([
    {
        type: "numeral",
        name: 'num_folders',
        message: "\ncombien de dossiers voulez-vous créer (pour le front, le back, etc.) ?",
        min: 1,
        max: 10,
    },
    {
        type: 'input',
        name: 'folder_names',
        message: "\ncomment voulez-vous nommer vos dossiers ? (les noms doivent être séparés par des virgules)",
    },
]).then(answers => {
    const folderNames = answers.folder_names.split(',').map(name => name.trim());
    console.log(`\nvous allez créer ${answers.num_folders} dossiers avec les noms suivants : ${folderNames.join(', ')}\n`);

    folderNames.forEach(folderName => {
        fs.mkdirSync(folderName, { recursive: true });
        console.log(`Le dossier ${folderName} a été créé.\n`);
    });

    folders.frontEnd = folderNames[0];
    folders.backEnd = folderNames[1] || folderNames[0];

    console.log("");
    return prompt([
        {
            type: "select",
            name: "frontend_lang",
            message: "\nquel langage voulez-vous utiliser pour votre front-end ?",
            choices: ["HTML + CSS", "React avec Vite", "React", "Vue", "Angular", "Svelte"],
        },
        {
            type: "input",
            name: "frontend_port",
            message: "\nsur quel port voulez-vous lancer votre front-end ?",
            initial: 3000,
            validate: value => {
                const port = parseInt(value);
                if (isNaN(port) || port < 1000 || port > 9999) {
                    return "veuillez saisir un numéro de port valide";
                }
                return true;
            }
        },

        {
            type: "select",
            name: "backend_lang",
            message: "\nquel langage voulez-vous utiliser pour votre back-end ?",
            choices: ["Node.js avec Express", "Node.js avec Koa", "PHP", "PHP avec Laravel", "PHP avec Symfony", "Django", "Flask"],
        },
        {
            type: "input",
            name: "backend_port",
            message: "\nsur quel port voulez-vous lancer votre back-end ?",
            initial: 8000,
            validate: value => {
                const port = parseInt(value);
                if (isNaN(port) || port < 1000 || port > 9999) {
                    return "veuillez saisir un numéro de port valide";
                }
                return true;
            }
        },
        {
            type: "select",
            name: "db_choice",
            message: "\nvoulez-vous ajouter une base de données ?",
            choices: ["MySQL", "PostgreSQL", "MongoDB", "SQLite", "non"],
        },
    ]);
}).then(answers => {
    ports.frontEnd = answers.frontend_port;
    ports.backEnd = answers.backend_port;

    if (answers.frontend_lang === "HTML + CSS") {
        createHtmlCssFiles(folders.frontEnd);
    }

    if (answers.db_choice !== "non") {
        console.log("");
        return prompt([
            {
                type: "input",
                name: "db_username",
                message: "\nentrez le nom d'utilisateur pour la base de données :",
            },
            {
                type: "password",
                name: "db_password",
                message: '\nentrez le mot de passe pour la base de données :',
            },
            {
                type: "input",
                name: "db_name",
                message: "\nentrez le nom de la base de données :",
            },
            {
                type: "input",
                name: "db_config_file",
                message: "\ncomment voulez-vous nommer votre fichier de configuration de la base de données ?",
                initial: "dbConfig",
            },
            {
                type: "select",
                name: "db_folder",
                message: "\noù voulez-vous créer le fichier de configuration de la base de données ?",
                choices: ["à la racine", folders.backEnd],
            },
        ]).then(dbAnswers => {
            if (answers.backend_lang === "PHP") {
                createPhpDbFile(dbAnswers, folders.backEnd);
            } else {
                createDbConfigFile(answers, dbAnswers);
            }
            installDependencies(answers);
        });
    } else {
        installDependencies(answers);
    }
}).catch(error => {
    console.error("\nerreur réponses : ", error);
});

function createHtmlCssFiles(folderName) {
    fs.writeFileSync(`${folderName}/index.html`, "<!DOCTYPE html>\n<html>\n<head>\n\t<title>Bienvenue</title>\n\t<link rel='stylesheet' href='index.css'>\n</head>\n<body>\n\t<h1>Et tout et tout</h1>\n</body>\n</html>");
    fs.writeFileSync(`${folderName}/index.css`, "body { font-family: Arial, sans-serif; }");
    console.log(`\nles fichiers index.html et index.css créés dans : ${folderName}\n`);
}

function createPhpDbFile(dbAnswers, folderName) {
    const { db_username, db_password, db_name } = dbAnswers;
    const dbConnectContent = `<?php
$servername = "localhost";
$username = "${db_username}";
$password = "${db_password}";
$dbname = "${db_name}";

// créer la connexion
$conn = new mysqli($servername, $username, $password, $dbname);

// gérer les erreurs et tout et tout
if ($conn->connect_error) {
    die("Connexion échouée: " . $conn->connect_error);
}
echo "Connexion ok";
?>`;
    fs.writeFileSync(`${folderName}/dbConnect.php`, dbConnectContent);
    console.log(`\nle fichier de connexion à la base de données a été créé dans : ${folderName}/dbConnect.php\n`);
}

function installDependencies(answers) {
    console.log("\ninstallation des dépendances...\n");
    const { frontend_lang, backend_lang } = answers;

    // Front-end
    try {
        if (frontend_lang === "React avec Vite") {
            console.log(`initialisation du projet React avec Vite dans le dossier '${folders.frontEnd}'...`);
            execSync(`npm create vite@latest ${folders.frontEnd} -- --template react`, { stdio: 'inherit' });
        } else if (frontend_lang === 'Vue') {
            console.log(`initialisation du projet Vue dans le dossier '${folders.frontEnd}'...`);
            execSync(`npm init vue@latest ${folders.frontEnd}`, { stdio: 'inherit' });
        } else if (frontend_lang === 'HTML + CSS') {
            console.log(`initialisation du projet HTML + CSS dans le dossier '${folders.frontEnd}'...`);
            // Vous pouvez ajouter ici des actions spécifiques pour l'installation des dépendances HTML + CSS si nécessaire
        }
    } catch (error) {
        console.error("erreur lors de l'installation des dépendances front-end : ", error);
    }

    // Back-end
    try {
        if (backend_lang.includes('Node.js')) {
            console.log(`installation de ${backend_lang} dans le dossier '${folders.backEnd}'...`);
            execSync(`npm init -y`, { stdio: 'inherit', cwd: folders.backEnd });
            const package = backend_lang.includes('Express') ? 'express' : 'koa';
            execSync(`npm install ${package}`, { stdio: 'inherit', cwd: folders.backEnd });
        } else if (backend_lang.includes('PHP')) {
            console.log(`installation de ${backend_lang} dans le dossier '${folders.backEnd}'...`);
            if (!fs.existsSync(folders.backEnd)) {
                fs.mkdirSync(folders.backEnd);
            }
            const projectCommand = backend_lang.includes('Laravel') ?
                `composer create-project --prefer-dist laravel/laravel .` :
                `composer create-project symfony/skeleton .`;
            execSync(projectCommand, { stdio: 'inherit', cwd: folders.backEnd });
        }
        else if (backend_lang === 'PHP') {
            console.log(`initialisation du projet PHP dans le dossier '${folders.backEnd}'...`);
        }
    } catch (error) {
        console.error("erreur lors de l'installation des dépendances back-end : ", error);
    }

    console.log("\ndépendances installées avec succès, et tout et tout");
    startServers(answers);
}


function createDbConfigFile(answers, dbAnswers) {
    const { db_choice } = answers;
    const { db_username, db_password, db_name, db_config_file, db_folder } = dbAnswers;
    const dbConfigPath = db_folder === 'à la racine' ? '.' : folders.backEnd;
    const dbConfigContent = `
const dbConfig = {
    type: '${db_choice}',
    username: '${db_username}',
    password: '${db_password}',
    database: '${db_name}'
};

module.exports = dbConfig;
    `.trim();

    fs.writeFileSync(`${dbConfigPath}/${db_config_file}.js`, dbConfigContent);
    console.log(`\nle fichier de configuration de la base de données a été créé dans : ${dbConfigPath}/${db_config_file}.js\n`);
}

// démarrage serveurs
function startServers(answers) {
    console.log("\nlancement des serveurs... patientez..... ;) ;)\n");

    const { execSync } = require('child_process');
    const frontEndCommand = `cd ${folders.frontEnd} && `;
    const frontEndPort = ports.frontEnd;
    let frontEndStartCommand = '';
    if (answers.frontend_lang === "React avec Vite") {
        frontEndStartCommand = `npm install && npm run dev -- --port ${frontEndPort}`;
    } else if (answers.frontend_lang === "Vue") {
        frontEndStartCommand = `npm run serve -- --port ${frontEndPort}`;
    } else if (answers.frontend_lang === "HTML + CSS") {
        frontEndStartCommand = `python3 -m http.server ${frontEndPort}`;
    }
    execSync(frontEndCommand + frontEndStartCommand, { stdio: 'inherit' });
    const backEndCommand = `cd ${folders.backEnd} && `;
    const backEndPort = ports.backEnd;
    let backEndStartCommand = '';
    if (answers.backend_lang.includes('Node.js')) {
        backEndStartCommand = `npm install && npm start -- --port ${backEndPort}`;
    } else if (answers.backend_lang.includes('PHP')) {
        backEndStartCommand = `php -S localhost:${backEndPort} -t public`;
    }
    execSync(backEndCommand + backEndStartCommand, { stdio: 'inherit' });


    // ouvre les navigateurs
    setTimeout(() => {
        const { execSync } = require('child_process');
        const open = require('open');

        const openCommand = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
        const frontEndURL = `http://localhost:${frontEndPort}`;
        const backEndURL = `http://localhost:${backEndPort}`;

        execSync(`${openCommand} ${frontEndURL}`);
        execSync(`${openCommand} ${backEndURL}`);
    }, 2000);
}