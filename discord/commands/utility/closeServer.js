const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { apiToken } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('closerserver')
        .setDescription('Close the flask server'),

    async execute(interaction) {
        console.log(apiToken)
        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/end", {
                method: "POST",
                headers: {"X-Internal-Token": apiToken}
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch (error) {
            console.log(`Failed to create guild DB file:\n${error}`)
            return await interaction.reply({
                content: `Error closing server:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result,
            flags: MessageFlags.Ephemeral
        });
    },
};
