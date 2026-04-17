from main import FRAUD_DATA_PATH, FRAUD_MODEL_PATH, generate_fraud_dataset, train_fraud_model, ensure_dirs


def main():
    ensure_dirs()
    dataset = generate_fraud_dataset()
    train_fraud_model(dataset)
    print(f"fraud_dataset={FRAUD_DATA_PATH}")
    print(f"fraud_model={FRAUD_MODEL_PATH}")


if __name__ == "__main__":
    main()
