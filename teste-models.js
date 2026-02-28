async function listModels() {
    const apiKey = "AIzaSyDKihwzw9boxKOtitK4SIuv-FYykkTPNac";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("--- MODELOS DISPONÍVEIS NA SUA CHAVE ---");
        if (data.models) {
            data.models.forEach(m => {
                // Remove o prefixo 'models/' para ficar mais fácil de ler
                const modelId = m.name.split('/').pop();
                console.log(`> ID: ${modelId}`);
                console.log(`  Descrição: ${m.description}`);
                console.log('---------------------------------------');
            });
        } else {
            console.log("Erro na resposta da API:", data);
        }
    } catch (error) {
        console.error("Erro na requisição:", error.message);
    }
}

listModels();