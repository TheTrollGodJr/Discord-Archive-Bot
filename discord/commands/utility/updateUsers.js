const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { apiToken } = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateusers')
        .setDescription('Update the guild db current user list'),

    async execute(interaction) {
        const guild = interaction.guild;

        let data = {
            "guild_id": guild.id,
            "guild_name": guild.name,
            "users": []
        };

        const members = await guild.members.fetch();
        members.forEach(member => {
            data.users.push({
                id: member.user.id,
                name: member.user.username,
                global_name: member.user.globalName
            })
        });


        let result = null;
        try {
            const resp = await fetch("http://127.0.0.1:5000/add-users", {
                method: "POST",
                headers: {
                    "content-type": "application/json",
                    "X-Internal-Token": apiToken
                },
                body: JSON.stringify(data)
            });

            result = await resp.json();
            console.log(`Server Response:\n${JSON.stringify(result)}`)

        } catch(error) {
            console.log(`Failed to update users table:\n${error}`)
            return await interaction.reply({
                content: `Failed to update users table:\n> ${error}`,
                flags: MessageFlags.Ephemeral
            });
        }

        await interaction.reply({
            content: result.status,
            flags: MessageFlags.Ephemeral
        });
    },
};
