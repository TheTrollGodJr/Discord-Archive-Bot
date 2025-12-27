const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { apiToken } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createguilddb')
        .setDescription('Create the db file for the server this command is run in'),

    async execute(interaction) {
        const guild = interaction.guild;

        if (!guild) {
            return await interaction.reply("This command can only be run in a server")
        }
        console.log(`Command run in guild: ${guild.name} (id: ${guild.id})`)

        const data = {
            "guild_id": guild.id,
            "guild_name": guild.name
        }

        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/create-guild", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "X-Internal-Token": apiToken
                },
                body: JSON.stringify(data)
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch (error) {
            console.log(`Failed to create guild DB file:\n${error}`)
            return await interaction.reply({
                content: `Failed to create guild DB file:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result.msg,
            flags: MessageFlags.Ephemeral
        });
    },
};
