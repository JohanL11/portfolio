<?php

namespace App\Form\Type;

use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\Extension\Core\Type\TextareaType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\DataTransformerInterface;

class JsonType extends AbstractType implements DataTransformerInterface
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder->addModelTransformer($this);
    }

    public function transform(mixed $value): string
    {
        if (empty($value)) {
            return '';
        }
        return json_encode($value, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function reverseTransform(mixed $value): mixed
    {
        if (empty($value)) {
            return null;
        }
        return json_decode($value, true) ?? $value;
    }

    public function getParent(): string
    {
        return TextareaType::class;
    }
}
