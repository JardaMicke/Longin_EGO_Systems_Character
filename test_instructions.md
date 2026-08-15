# Testing Instructions for Developers

1. Start the complete Docker environment:
   `docker-compose up --build -d`

2. Check the services:
   - Neo4j UI will be at `http://localhost:7474` (login: `neo4j` / `semantica_password`)
   - Python Semantica Backend will be at `http://localhost:8000/health`
   - React App will be at `http://localhost:3000`

3. In the React app Settings:
   - Set Provider to "Ollama"
   - You should see the models dynamically load from your host machine into the dropdown.
   - If not, verify that `HOST_OLLAMA_URL` is accessible from within the container.

4. Start chatting with a character:
   - Send a message.
   - Wait for the reply.
   - Open Neo4j UI (`http://localhost:7474`) and run query: `MATCH (n) RETURN n`
   - You should see the Character node linked to Event nodes via `EXPERIENCED` relationships.
