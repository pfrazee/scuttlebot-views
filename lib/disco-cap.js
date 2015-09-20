/**
 *
 * This is the key for accessing the ssb protocol.
 * This will be updated whenever breaking changes are made.
 * (see secret-handshake paper for a full explaination)
 *
 */
module.exports =
  new Buffer('vJ+HjbBfIWyHGDMF2KX5oTPryYrcGY74sgrLE1quJHc=', 'base64')

//there is nothing special about this value.
//I generated it in the node repl with:
//
// > crypto.randomBytes(32).toString('base64')
//
//and copied it here.

