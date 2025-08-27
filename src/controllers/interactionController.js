// src/controllers/interactionController.js
const db = require('../config/database');
const snakeToCamel = (str) => str.replace(/([-_][a-z])/g, (g) => g.toUpperCase().replace('_', ''));

// POST /clients/:clientId/interactions
exports.createInteraction = async (req, res) => {
    const { clientId } = req.params;
    const { type, observation, from_status, to_status } = req.body;
    const userId = req.user.id; // From middleware

    if (!type || !observation) {
        return res.status(400).json({ error: 'Type and observation are required.' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // --- Step 1: Check client's initial state if this is the FIRST follow-up ---
        let shouldUpdateClientState = false;
        if (type === 'Follow-up Agendado') {
             const clientStateRes = await client.query(
                "SELECT follow_up_state FROM clients WHERE id = $1",
                [clientId]
            );
            if (clientStateRes.rows[0]?.follow_up_state === 'Sem Follow Up') {
                shouldUpdateClientState = true;
            }
        }
        
        // --- Step 2: Handle substitution of previous scheduled follow-ups ---
        if (type === 'Follow-up Agendado') {
            await client.query(
                `UPDATE interactions SET substituted = true 
                 WHERE client_id = $1 AND type = 'Follow-up Agendado'`,
                [clientId]
            );
        }

        // --- Step 3: Insert the new interaction ---
        const interactionQuery = `
            INSERT INTO interactions (client_id, user_id, type, observation, from_status, to_status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const { rows } = await client.query(interactionQuery, [clientId, userId, type, observation, from_status, to_status]);
        
        // --- Step 4: Update client status if it's a status change interaction ---
        if (type === 'Mudança de Status' && to_status) {
            await client.query('UPDATE clients SET status = $1 WHERE id = $2', [to_status, clientId]);
        }
        
        // --- Step 5: Update client's follow-up state to 'Ativo' if it was the first one ---
        if (shouldUpdateClientState) {
            await client.query(
                "UPDATE clients SET follow_up_state = 'Ativo' WHERE id = $1",
                [clientId]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(rows.map(row => {
            const camelRow = {};
            for (const key in row) {
                camelRow[snakeToCamel(key)] = row[key];
            }
            return camelRow;
        })[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating interaction:', error);
        res.status(500).json({ error: 'Erro ao criar interação.' });
    } finally {
        client.release();
    }
};