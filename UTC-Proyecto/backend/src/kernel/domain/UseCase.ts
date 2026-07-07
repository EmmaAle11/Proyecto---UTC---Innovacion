/** Un caso de uso de aplicación: una entrada, una salida, una responsabilidad. */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
