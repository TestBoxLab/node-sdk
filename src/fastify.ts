interface FastifyReply {
  code(code: number): FastifyReply;
  status(code: number): FastifyReply;
  header(key: string, value: string): FastifyReply;
  send(body: any): FastifyReply;
}
