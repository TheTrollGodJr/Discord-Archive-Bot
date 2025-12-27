const { SlashCommandBuilder, MessageFlags } = require('discord.js');
//const fetch = require('node-fetch')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updatechannels')
        .setDescription('Update all channels in a guild to the db'),

    async execute(interaction) {
        const guild = interaction.guild;

        let data = {
            "guild_id": guild.id,
            "guild_name": guild.name,
            "channels": []
        };

        guild.channels.cache.forEach(channel => {
            if (channel.type == 0) {
                data.channels.push({
                    "id": channel.id,
                    "name": channel.name,
                    "oldest_archived_message": null,
                    "newest_archived_message": null
                })
            }
        });

        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/add-channel", {
                method: "POST",
                headers: {"content-type": "application/json"},
                body: JSON.stringify(data)
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch(error) {
            console.log(`Failed to update channels table:\n${error}`)
            return await interaction.reply({
                content: `Failed to update channels table:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result.status,
            flags: MessageFlags.Ephemeral
        });
    },
};
