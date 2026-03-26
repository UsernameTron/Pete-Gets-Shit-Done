# ML & Data Workflow Patterns

Patterns for agents working with data pipelines, machine learning, and experiment management.

---

## Data Exploration Workflow

**When to Use**: pandas-specialist, data-visualization-expert, feature-engineering-specialist, jupyter-workflow-expert

### Template

```
## Workflow

1. **Profile**: Understand the dataset.
   - Shape: rows, columns, dtypes
   - Missing values: count and pattern (MCAR, MAR, MNAR)
   - Distributions: histograms for numeric, value counts for categorical
   - Correlations: pairwise correlation matrix
   - Outliers: IQR method, z-scores for numeric columns

2. **Clean**: Handle data quality issues.
   - Missing values: impute, drop, or flag based on missingness pattern
   - Duplicates: identify and remove or merge
   - Data types: convert to appropriate types (dates, categories, numerics)
   - Outliers: cap, transform, or remove with justification

3. **Feature Engineer**: Create informative features.
   - Temporal: day of week, month, quarter, time since event
   - Aggregates: rolling means, cumulative sums, group statistics
   - Interactions: product features, ratio features
   - Encoding: target encoding (with proper CV), one-hot (for low cardinality)
   - Text: TF-IDF, character counts, sentiment scores

4. **Validate**: Ensure data quality.
   - Schema validation: expected columns, types, ranges
   - Statistical tests: distribution shifts, correlation stability
   - Leakage check: no future information in features
   - Reproducibility: set random seeds, document transformations
```

### Output Format

```
## Data Exploration Report

### Dataset Overview
| Metric | Value |
|--------|-------|
| Rows | {N} |
| Columns | {N} |
| Memory | {size} |
| Missing | {N} cells ({%}) |
| Duplicates | {N} rows |

### Column Summary
| Column | Type | Missing | Unique | Distribution |
|--------|------|---------|--------|--------------|
| {col} | {type} | {N} ({%}) | {N} | {summary} |

### Key Findings
{numbered list of insights}

### Data Quality Issues
| Issue | Column(s) | Severity | Recommended Action |
|-------|-----------|----------|--------------------|
| {issue} | {cols} | {sev} | {action} |

### Feature Engineering Recommendations
{list of suggested features with rationale}

### Status: DONE
```

---

## Training Workflow

**When to Use**: pytorch-specialist, sklearn-specialist, ml-ops-engineer

### Template

```
## Workflow

1. **Data Split**: Prepare train/validation/test sets.
   - Stratify by target variable if classification
   - Time-based split if temporal data (no random shuffle!)
   - Hold out test set — never use it during development
   - Typical split: 70/15/15 or 80/10/10

2. **Baseline Model**: Establish a simple baseline.
   - Classification: majority class, logistic regression
   - Regression: mean predictor, linear regression
   - Record baseline metrics on validation set

3. **Train**: Fit the model.
   - Start with default hyperparameters
   - Monitor training and validation metrics each epoch/iteration
   - Implement early stopping to prevent overfitting
   - Log: loss curves, metric curves, training time

4. **Evaluate**: Assess on validation set.
   - Classification: accuracy, precision, recall, F1, AUC-ROC, confusion matrix
   - Regression: RMSE, MAE, R², residual plots
   - Compare against baseline

5. **Hyperparameter Search**: Optimize configuration.
   - Use Bayesian optimization or random search (not grid search for >3 params)
   - Define search space with reasonable bounds
   - Use cross-validation (k-fold or time-series CV)
   - Track all experiments (MLflow/W&B)

6. **Final Evaluation**: Test set evaluation.
   - Train final model on train+validation with best hyperparameters
   - Evaluate on held-out test set (ONCE)
   - Record final metrics
   - Analyze failure cases
```

### Output Format

```
## Training Report

### Data Split
| Set | Rows | Target Distribution |
|-----|------|---------------------|
| Train | {N} | {distribution} |
| Validation | {N} | {distribution} |
| Test | {N} | {distribution} |

### Baseline
| Metric | Value |
|--------|-------|
| {metric} | {value} |

### Best Model
- Algorithm: {name}
- Hyperparameters: {dict}
- Training time: {duration}

### Results
| Metric | Baseline | Model | Improvement |
|--------|----------|-------|-------------|
| {metric} | {val} | {val} | {+/- %} |

### Experiment Log
| Run | Config | Val {metric} | Notes |
|-----|--------|-------------|-------|
| 1 | {config} | {value} | baseline |
| 2 | {config} | {value} | {change} |

### Status: DONE | DONE_WITH_CONCERNS
```

---

## Model Deployment Workflow

**When to Use**: ml-ops-engineer, containerization-specialist

### Template

```
## Workflow

1. **Serialize**: Save the trained model.
   - Use framework-native format (pickle for sklearn, TorchScript/ONNX for PyTorch)
   - Version the model artifact (include training date, metrics, data hash)
   - Save preprocessing pipeline alongside model

2. **Containerize**: Create deployment package.
   - Write inference server (FastAPI/Flask for Python, TorchServe/Triton for GPU)
   - Create Dockerfile with pinned dependencies
   - Include health check endpoint
   - Optimize image size (multi-stage build, no training dependencies)

3. **Deploy**: Release to serving infrastructure.
   - Canary deployment: route small % of traffic to new model
   - A/B testing: if comparing against previous model
   - Shadow mode: run new model alongside old, compare outputs without serving

4. **Monitor**: Track production performance.
   - Prediction latency (P50/P95/P99)
   - Error rates and types
   - Input data drift (feature distribution shifts)
   - Prediction distribution shifts (model output drift)
   - Business metrics impact

5. **Retrain Trigger**: Define when to retrain.
   - Scheduled: fixed cadence (weekly, monthly)
   - Drift-triggered: when data drift exceeds threshold
   - Performance-triggered: when accuracy drops below threshold
```

---

## Experiment Tracking Pattern

**When to Use**: ml-ops-engineer, pytorch-specialist, sklearn-specialist

### Template

```
## Workflow

1. **Hypothesis**: State what you expect.
   - "Adding feature X should improve AUC by ~2%"
   - "Reducing learning rate should stabilize training"

2. **Setup**: Configure experiment.
   - Log: dataset version, code commit, environment
   - Define metrics to track
   - Set comparison baseline

3. **Run**: Execute and log.
   - Log hyperparameters, metrics, artifacts
   - Tag runs with meaningful names
   - Capture system metrics (GPU utilization, memory)

4. **Compare**: Analyze results.
   - Compare against baseline and hypothesis
   - Check statistical significance (multiple runs if possible)
   - Visualize metric differences

5. **Report**: Document conclusions.
   - Was hypothesis confirmed?
   - What was learned?
   - What to try next?
```

---

## Data Quality Workflow

**When to Use**: data-pipeline-engineer, feature-engineering-specialist

### Template

```
## Workflow

1. **Schema Validation**: Verify structure.
   - Expected columns present
   - Data types correct
   - Required fields non-null
   - Values within expected ranges

2. **Statistical Tests**: Check distributions.
   - Compare against reference distribution
   - Kolmogorov-Smirnov test for continuous features
   - Chi-squared test for categorical features
   - Flag significant shifts (p < 0.05)

3. **Drift Detection**: Monitor over time.
   - Population Stability Index (PSI) for feature drift
   - Model performance degradation as proxy for concept drift
   - Window-based comparison (current vs reference period)

4. **Alerting**: Notify on issues.
   - Schema violations: immediate alert
   - Statistical drift: warning if PSI > 0.1, critical if > 0.25
   - Missing data spike: alert if >2x historical average
```
