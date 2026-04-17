# Infrastructure Workflow Patterns

Patterns for agents managing cloud resources, infrastructure changes, and operational tasks.

---

## Provisioning Workflow

**When to Use**: terraform-specialist, aws-architect, gcp-architect, kubernetes-specialist

### Template

```
## Workflow

1. **Plan**: Define desired state.
   - Write infrastructure as code (Terraform, CDK, Pulumi)
   - Document: what resources, what configuration, what dependencies
   - Estimate cost impact

2. **Review**: Validate before applying.
   - Run `terraform plan` / `cdk diff` / `pulumi preview`
   - Review every resource to be created, modified, or destroyed
   - Check for:
     - Unintended resource destruction
     - Security group / firewall rule changes
     - IAM permission escalation
     - Cost implications

3. **Apply**: Execute the change.
   - Apply in non-production environment first
   - Verify resources are created correctly
   - Run smoke tests against new infrastructure
   - Apply to production with same configuration

4. **Verify**: Confirm correct state.
   - Check resource status in cloud console or CLI
   - Verify connectivity and functionality
   - Confirm monitoring and alerting is active
   - Update documentation / runbooks

5. **Document**: Record what changed.
   - Update architecture diagrams
   - Update runbooks if operational procedures changed
   - Record in change management system
```

### Output Format

```
## Infrastructure Change Report

### Change Summary
| Action | Resource Type | Resource Name | Details |
|--------|--------------|---------------|---------|
| CREATE | {type} | {name} | {details} |
| MODIFY | {type} | {name} | {what changed} |
| DELETE | {type} | {name} | {reason} |

### Cost Impact
- Monthly estimate: ${before} → ${after} (${delta}/month)

### Risk Assessment
- Blast radius: {LOW|MEDIUM|HIGH}
- Rollback plan: {description}
- Downtime expected: {none|duration}

### Verification
- [ ] Non-prod deployment successful
- [ ] Smoke tests passing
- [ ] Monitoring confirmed
- [ ] Production deployment successful

### Status: DONE | DONE_WITH_CONCERNS
```

---

## Migration Workflow

**When to Use**: migration-specialist, database-expert, cloud-cost-optimizer

### Template

```
## Workflow

1. **Assess**: Understand current state.
   - Inventory what's being migrated
   - Document dependencies and integrations
   - Identify data that needs transformation
   - Estimate migration volume and timeline

2. **Plan**: Design the migration.
   - Choose strategy: big bang, phased, parallel run
   - Define rollback plan for each phase
   - Plan data validation approach
   - Schedule migration windows

3. **Test**: Validate in staging.
   - Run full migration in non-production
   - Verify data integrity (row counts, checksums, spot checks)
   - Test application functionality against migrated data
   - Measure migration duration
   - Test rollback procedure

4. **Migrate**: Execute production migration.
   - Follow the tested runbook exactly
   - Monitor throughout (error rates, data counts)
   - Validate at each checkpoint
   - Keep old system available for rollback

5. **Validate**: Confirm success.
   - Data integrity verification (compare source and target)
   - Application functionality testing
   - Performance comparison (before vs after)
   - User acceptance testing

6. **Cutover**: Switch traffic.
   - Update DNS / load balancer / connection strings
   - Monitor error rates closely
   - Keep rollback available for defined period
   - Decommission old system after confidence period
```

---

## Scaling Workflow

**When to Use**: kubernetes-specialist, serverless-expert, sre-practices-advisor

### Template

```
## Workflow

1. **Monitor**: Detect scaling need.
   - Resource utilization approaching thresholds
   - Latency increasing
   - Queue depth growing
   - Error rate rising

2. **Analyze**: Determine scaling type.
   - Vertical (bigger instances): CPU/memory bound, single process
   - Horizontal (more instances): I/O bound, stateless, parallelizable
   - Functional (decompose): Different components have different needs

3. **Scale**: Apply appropriate scaling.
   - Auto-scaling: set policies (target CPU, queue depth, custom metrics)
   - Manual: resize instances, add replicas
   - Architecture: refactor for horizontal scaling if needed

4. **Verify**: Confirm scaling worked.
   - Metrics return to acceptable ranges
   - No new errors introduced
   - Cost is within budget
   - Update capacity plan

5. **Document**: Update capacity plan.
   - Current capacity and utilization
   - Growth projections
   - Cost projections
   - Next scaling trigger point
```

---

## Disaster Recovery Workflow

**When to Use**: sre-practices-advisor, aws-architect, gcp-architect

### Template

```
## Workflow

1. **Backup**: Ensure data is protected.
   - Database backups: automated, verified, encrypted
   - Configuration backups: IaC in version control
   - Application state: documented recovery procedure
   - Test restore: regularly verify backups are usable

2. **Plan**: Define recovery procedures.
   - RPO (Recovery Point Objective): max acceptable data loss
   - RTO (Recovery Time Objective): max acceptable downtime
   - Define scenarios: single service, availability zone, full region
   - Write runbooks for each scenario

3. **Drill**: Practice recovery.
   - Schedule regular DR drills (quarterly minimum)
   - Simulate realistic failures
   - Time the recovery
   - Document lessons learned

4. **Improve**: Refine based on drills.
   - Update runbooks with drill findings
   - Automate manual steps where possible
   - Adjust RPO/RTO targets if needed
   - Address single points of failure
```

---

## Cost Optimization Workflow

**When to Use**: cloud-cost-optimizer, aws-architect, gcp-architect

### Template

```
## Workflow

1. **Inventory**: Map all cloud resources and costs.
   - By service, by team, by environment
   - Identify untagged resources
   - Find idle or underutilized resources

2. **Analyze**: Identify savings opportunities.
   - Right-sizing: match instance size to actual usage
   - Reserved instances / Savings Plans: commit for discounts
   - Spot/preemptible instances: for fault-tolerant workloads
   - Storage tiering: move cold data to cheaper tiers
   - Scheduling: stop non-production outside business hours

3. **Recommend**: Propose changes with ROI.
   - Estimate savings for each recommendation
   - Assess risk and effort
   - Prioritize by savings / effort ratio

4. **Implement**: Apply optimizations.
   - Start with low-risk, high-savings items
   - Monitor for performance impact
   - Track actual vs estimated savings

5. **Track**: Ongoing cost management.
   - Set budgets and alerts
   - Monthly cost review
   - Anomaly detection for unexpected spikes
```

### Output Format

```
## Cost Optimization Report

### Current Spend
| Category | Monthly Cost | % of Total |
|----------|-------------|------------|
| {category} | ${amount} | {%} |

### Recommendations
| Priority | Action | Est. Savings | Effort | Risk |
|----------|--------|-------------|--------|------|
| 1 | {action} | ${monthly} | S/M/L | LOW/MED/HIGH |

### Total Potential Savings: ${amount}/month ({%} reduction)

### Status: DONE
```
