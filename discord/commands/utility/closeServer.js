const { SlashCommandBuilder, MessageFlags } = require('discord.js');
//const fetch = require('node-fetch')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('closerserver')
        .setDescription('Close the flask server'),

    async execute(interaction) {

        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/end", {
                method: "POST",
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
